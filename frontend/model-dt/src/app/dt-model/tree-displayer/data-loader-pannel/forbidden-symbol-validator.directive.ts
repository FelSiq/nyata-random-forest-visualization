import { Directive } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Directive({
  selector: '[appForbiddenSymbolValidator]',
})
export class ForbiddenSymbolValidatorDirective {

  constructor() { }

}

/** font: https://angular.io/guide/form-validation */
export function forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const forbidden = nameRe.test(control.value);
    return forbidden ? {'forbiddenName': {value: control.value}} : null;
  };
}

export function checkInstanceDimension(
    attrs: string,
    sep: string,
    datasetDim: number | string): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const correctDim = attrs ? attrs.split(sep).length : 0;
    return correctDim !== datasetDim ? {'instanceDimension': {value: control.value}} : null;
  };
}
