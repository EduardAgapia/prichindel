import { CommonModule } from '@angular/common';
import { Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, timeout } from 'rxjs';

interface Availability { cap: number; occupied: number; free: number; open: boolean }
interface SheetResponse { status: string; table?: { rows: { c: ({ v: unknown } | null)[] }[] } }
interface CalendarDay { number: number; key: number; state: string; label: string; selectable: boolean; today: boolean }

@Component({
  selector: 'app-programari', standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './programari.component.html', styleUrl: './programari.component.css'
})
export class ProgramariComponent implements OnInit {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = 'https://docs.google.com/forms/d/e/1FAIpQLSepd29Vd1z4GTLbMR9VjFPQ5P8LeX1tsZ6SoANqolStlM2jXA/viewform';
  private readonly sheet = '1io2iewZkXjqZNvQOu3FL8GU5a6TB9j0oPzPhtch_R-0';
  private availability: Record<number, Availability> = {};
  private todayKey = 0;
  startMonth = 0;
  month = 0;
  days: CalendarDay[] = [];
  title = '';
  loading = true;
  error = false;
  selected: number | null = null;
  message = 'Alege o zi verde sau galbenă ca să vezi detaliile.';
  canRegister = false;
  private requesting = false;

  ngOnInit(): void {
    this.updateDate();
    this.month = this.startMonth;
    this.render();
    this.refresh();
    const timer = window.setInterval(() => this.refresh(), 5 * 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') this.refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  private updateDate(): void {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
    this.todayKey = part('year') * 10000 + part('month') * 100 + part('day');
    this.startMonth = part('year') * 12 + part('month') - 1;
  }

  refresh(): void {
    if (this.requesting) return;
    this.requesting = true;
    this.loadSheet()
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.requesting = false;
          if (response.status === 'error' || !response.table) { this.failed(); return; }
          const data: Record<number, Availability> = {};
          for (const row of response.table.rows) {
            const v = row.c.map(c => Number(c?.v ?? 0));
            if (v.length >= 5 && v.every(Number.isFinite) && v[0] > 20000000 && v.slice(1, 4).every(n => n >= 0)) {
              data[v[0]] = { cap: v[1], occupied: v[2], free: v[3], open: v[4] === 1 };
            }
          }
          if (!Object.keys(data).length) { this.failed(); return; }
          this.availability = data;
          this.loading = false;
          this.error = false;
          this.updateDate();
          this.month = Math.max(this.startMonth, Math.min(this.month, this.startMonth + 2));
          this.render();
          if (this.selected !== null) this.choose(this.selected);
        },
        error: () => { this.requesting = false; this.failed(); }
      });
  }

  private loadSheet(): Observable<SheetResponse> {
    // Google expects tqx=responseHandler:NAME; Angular's JSONP client only
    // replaces =JSONP_CALLBACK, so its callback cannot be used in this format.
    return new Observable(observer => {
      const callback = `pcCalendar_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const callbacks = window as unknown as Record<string, unknown>;
      const script = document.createElement('script');
      callbacks[callback] = (response: SheetResponse) => this.zone.run(() => {
        observer.next(response);
        observer.complete();
      });
      script.onerror = () => this.zone.run(() => observer.error(new Error('Calendar unavailable')));
      script.src = `https://docs.google.com/spreadsheets/d/${this.sheet}/gviz/tq?sheet=public&tqx=responseHandler:${callback}&t=${Date.now()}`;
      document.head.appendChild(script);
      return () => {
        script.remove();
        script.onerror = null;
        delete callbacks[callback];
      };
    });
  }

  private failed(): void {
    this.loading = false;
    this.error = true;
    this.canRegister = false;
    this.message = 'Nu am putut încărca disponibilitatea actualizată. Reîncearcă în câteva minute.';
  }

  changeMonth(delta: number): void {
    this.month = Math.max(this.startMonth, Math.min(this.month + delta, this.startMonth + 2));
    this.render();
  }

  private render(): void {
    const year = Math.floor(this.month / 12), month = this.month % 12;
    this.title = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    this.days = Array.from({ length: offset }, () => ({ number: 0, key: 0, state: 'pc-empty', label: '', selectable: false, today: false }));
    for (let number = 1; number <= new Date(year, month + 1, 0).getDate(); number++) {
      const key = year * 10000 + (month + 1) * 100 + number;
      const dow = new Date(year, month, number).getDay();
      const z = this.availability[key];
      let state = '', label = '', selectable = key >= this.todayKey;
      if (dow === 0 || dow === 6) state = 'we';
      else if (key >= this.todayKey && z) {
        if (z.cap === 0) { state = 'inchis'; label = 'închis'; }
        else if (z.free === 0) { state = 'complet'; label = 'complet'; }
        else { state = z.open ? (z.free <= 5 ? 'putine' : 'liber') : 'info'; label = `${z.free} locuri`; selectable = true; }
      }
      this.days.push({ number, key, state, label, selectable, today: key === this.todayKey });
    }
  }

  choose(key: number): void {
    this.selected = key;
    const z = this.availability[key];
    const dow = new Date(Math.floor(key / 10000), Math.floor(key / 100) % 100 - 1, key % 100).getDay();
    this.canRegister = !this.error && dow !== 0 && dow !== 6 && key >= this.todayKey && !!z?.open && z.cap > 0 && z.free > 0;
    const date = `${String(key % 100).padStart(2, '0')}.${String(Math.floor(key / 100) % 100).padStart(2, '0')}.${Math.floor(key / 10000)}`;
    if (this.error || this.loading || !z) {
      this.message = `${date}: disponibilitatea ${this.loading ? 'se încarcă' : 'nu este disponibilă momentan'}.`;
      return;
    }
    this.message = this.canRegister
      ? `${date}: mai sunt ${z.free} locuri din ${z.cap}. În formular bifează ziua respectivă (și oricare alte zile de care ai nevoie).`
      : `${date}: ${z?.free ?? 0} locuri libere. Înscrierea online pentru această zi nu este disponibilă acum (termen depășit, zi completă sau prea departe în viitor).`;
  }
}
