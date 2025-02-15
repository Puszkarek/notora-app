import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

export class ActionQueue {
  private _itemsInQueue = 0;

  private readonly _isSaving$ = new BehaviorSubject<boolean>(false);
  public readonly isSaving$ = this._isSaving$.asObservable().pipe(distinctUntilChanged());

  public increment(): void {
    this._itemsInQueue++;
    this._isSaving$.next(true);
  }

  public decrement(): void {
    this._itemsInQueue--;

    if (this._itemsInQueue <= 0) {
      this._isSaving$.next(false);
    }
  }

  public isSaving(): boolean {
    return this._itemsInQueue > 0;
  }
}
