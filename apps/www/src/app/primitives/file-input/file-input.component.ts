/* eslint-disable functional/immutable-data */
import { IconComponent } from '@www/app/primitives/icon';
import { TooltipDirective } from '@www/app/directives/tooltip';
import { NotificationService } from '@www/app/services/notification';
import { environment } from '@www/environments/environment';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { maxFileSizeInBytes, validImageFileCodec } from '@api-interfaces';
import * as t from 'io-ts';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';

export const fileInputCodec = t.union([
  t.type({
    action: t.literal('keep'),
    savedBackground: t.string,
  }),
  t.type({
    action: t.literal('remove'),
    savedBackground: t.string,
  }),
  t.type({
    action: t.literal('add'),
    file: validImageFileCodec,
    savedBackground: t.union([t.string, t.null]),
  }),
]);

export type FileInput = t.TypeOf<typeof fileInputCodec>;

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TooltipDirective, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true,
    },
  ],
})
export class FileInputComponent implements OnInit, ControlValueAccessor {
  private readonly _file$ = new BehaviorSubject<FileInput | null>(null);
  public readonly file$ = this._file$.asObservable().pipe(distinctUntilChanged());

  public readonly savedBackground$ = this.file$.pipe(
    map(fileInput => fileInput?.savedBackground ?? null),
    distinctUntilChanged(),
  );

  public readonly background$ = this.file$.pipe(
    map(fileInput => {
      if (!fileInput) {
        return null;
      }

      if (fileInput.action === 'keep' && fileInput.savedBackground) {
        return `url(${this._getPhotoURL(fileInput.savedBackground)})`;
      }

      if (fileInput.action === 'add') {
        return `url(${URL.createObjectURL(fileInput.file)})`;
      }

      return null;
    }),
  );

  public readonly uploadIconID$ = this.background$.pipe(
    map(background => (background ? 'arrow-clockwise' : 'plus-lg')),
  );

  public readonly showUploadIconOnHover$ = this.background$.pipe(map(background => background !== null));

  constructor(private readonly _notificationsService: NotificationService) {}

  public ngOnInit(): void {
    this.file$.subscribe(file => {
      this._onTouched();
      this._onChange(file);
    });
  }

  public openFilePicker(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.click();

    // Listen for the upload
    input.addEventListener('change', ({ target }: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file: unknown = (target as any)?.files?.[0];

      if (!(file instanceof File)) {
        this._notificationsService.error('O arquivo não é válido');
        return;
      }
      if (file.size > maxFileSizeInBytes) {
        this._notificationsService.error(
          `O arquivo é muito grande, por favor escolha um arquivo até${maxFileSizeInBytes / 1024 / 1024}MB`,
        );
        return;
      }
      if (!file.type.startsWith('image/')) {
        this._notificationsService.error('O arquivo não é uma imagem');
        return;
      }
      if (!validImageFileCodec.is(file)) {
        this._notificationsService.error('Algo está errado com o arquivo');
        return;
      }

      this._file$.next({
        action: 'add',
        file,
        savedBackground: this._file$.getValue()?.savedBackground ?? null,
      });
    });
  }

  public removeFile(): void {
    const savedBackground = this._file$.getValue()?.savedBackground ?? null;
    if (savedBackground) {
      this._file$.next({
        action: 'remove',
        savedBackground: savedBackground,
      });
    } else {
      this._file$.next(null);
    }
  }

  public resetOriginal(savedBackground: string): void {
    this._file$.next({
      action: 'keep',
      savedBackground,
    });
  }

  private _getPhotoURL(filePath: string): string {
    return `${environment.imagesHost}/${filePath}`;
  }

  // * Control Value Accessor Stuff

  public writeValue(value: unknown): void {
    if (value !== null && !fileInputCodec.is(value)) {
      console.warn('Invalid file:', value);
      return;
    }

    this._file$.next(value);
  }

  private _onChange: (value: FileInput | null) => void = () => void 0;
  public registerOnChange(newFunction: typeof this._onChange): void {
    this._onChange = newFunction;
  }

  private _onTouched: () => void = () => void 0;
  public registerOnTouched(newFunction: typeof this._onTouched): void {
    this._onTouched = newFunction;
  }
}
