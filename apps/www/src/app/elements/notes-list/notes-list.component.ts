import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseNote } from '@api-interfaces';
import { IconComponent } from '../../primitives/icon/icon.component';

const GREEN_MANTIS_NOTE_COLOR = '#66cb62';
const BLUE_KOI_NOTE_COLOR = '#62a7cb';
const MEDIUM_PURPLE_NOTE_COLOR = '#8b62cb';
const INDIAN_RED_NOTE_COLOR = '#cb6262';
const CYAN_DOWNY_NOTE_COLOR = '#62cbc9';
const BASKET_BALL_ORANGE_NOTE_COLOR = '#FF7F50';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IconComponent],
})
export class NotesListComponent {
  private colors = [
    GREEN_MANTIS_NOTE_COLOR,
    BLUE_KOI_NOTE_COLOR,
    MEDIUM_PURPLE_NOTE_COLOR,
    INDIAN_RED_NOTE_COLOR,
    CYAN_DOWNY_NOTE_COLOR,
    BASKET_BALL_ORANGE_NOTE_COLOR,
  ];
  private _colorIndex = 0;

  public readonly notes = input.required<ReadonlyArray<BaseNote>>();

  // TODO: add color to the note
  public getNextColor(): string {
    const color = this.colors[this._colorIndex] ?? '#66cb62';
    this._colorIndex = (this._colorIndex + 1) % this.colors.length;
    return color;
  }
}
