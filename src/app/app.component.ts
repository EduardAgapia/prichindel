import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {
  Apple,
  BookCheck,
  BookOpen,
  BriefcaseBusiness,
  Bus,
  Footprints,
  GraduationCap,
  HandHeart,
  Heart,
  HeartHandshake,
  House,
  LucideAngularModule,
  MessagesSquare,
  Palette,
  ShieldCheck,
  Sprout,
  Users,
  Utensils,
  UtensilsCrossed,
  Clapperboard,
  PartyPopper,
  Sun
} from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  readonly BookOpen = BookOpen;
  readonly ShieldCheck = ShieldCheck;
  readonly MessagesSquare = MessagesSquare;
  readonly Sprout = Sprout;
  readonly Bus = Bus;
  readonly Utensils = Utensils;
  readonly Apple = Apple;
  readonly Palette = Palette;
  readonly House = House;
  readonly BookCheck = BookCheck;
  readonly GraduationCap = GraduationCap;
  readonly HeartHandshake = HeartHandshake;
  readonly BriefcaseBusiness = BriefcaseBusiness;
  readonly UtensilsCrossed = UtensilsCrossed;
  readonly Footprints = Footprints;
  readonly Heart = Heart;
  readonly HandHeart = HandHeart;
  readonly Users = Users;
  readonly Clapperboard = Clapperboard;
  readonly PartyPopper = PartyPopper;
  readonly Sun = Sun;

  menuOpen = false;
  currentYear = new Date().getFullYear();

  closeMenu(): void {
    this.menuOpen = false;
  }

  scrollTo(id: string): void {
    this.closeMenu();
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }
}
