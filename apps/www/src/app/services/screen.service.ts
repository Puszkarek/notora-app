import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  private readonly _breakpointObserver = inject(BreakpointObserver);

  public readonly isMobile$ = this._breakpointObserver.observe('(max-width: 768px)').pipe(
    map(state => state.matches),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    }),
  );

  public readonly isMobile = toSignal(this.isMobile$, {
    initialValue: false,
  });
}
