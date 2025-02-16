import { Signal, signal } from '@angular/core';

export type TraceableAction<T extends Array<unknown>> = {
  execute: (...actionArguments: T) => Promise<void>;
  isProcessing: Signal<boolean>;
};

export const traceAction = <T extends Array<unknown>>(
  action: (...actionArguments: T) => Promise<void>,
): TraceableAction<T> => {
  const isProcessing = signal(false);

  return {
    execute: async (...actionArguments) => {
      isProcessing.set(true);
      try {
        await action(...actionArguments);
      } catch (error) {
        console.error(error);
      }
      isProcessing.set(false);
    },
    isProcessing,
  };
};
