import { Pipe, PipeTransform } from '@angular/core';

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

@Pipe({
  name: 'list',
})
export class ListPipe implements PipeTransform {
  /**
   * Parse a array into a readable string (e.g: `['1', '2']` becomes `1, 2`)
   *
   * @param value - The array to parse
   * @returns A list in text format
   */
  public transform(list: ReadonlyArray<string>): string {
    return list.map(capitalize).join(', ');
  }
}
