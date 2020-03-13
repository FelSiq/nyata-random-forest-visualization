import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PredictResults } from '../predict-results';

const httpOptions = {
  withCredentials: true,
  // headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class DatasetUploadService {
  private urlResource = 'http://127.0.0.1:5000/predict-dataset';

  constructor(public httpClient: HttpClient) { }

  postFile(fileToUpload: File,
           sep: string,
           hasHeader: boolean,
           hasClasses: boolean): Observable<PredictResults> {
    const formData: FormData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('sep', sep);
    formData.append('hasHeader', hasHeader ? '1' : '0');
    formData.append('hasClasses', hasClasses ? '1' : '0');

    return this.httpClient
      .post(this.urlResource, formData, httpOptions)
      .pipe(
        catchError((e) => this.handleError(e))
      );
  }

  destroy() { 
    this.httpClient.delete(this.urlResource, httpOptions).subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while predicting a whole test dataset.
       Please check if given custom options corresponds to the dataset format,
       and if the given dataset is correctly formatted.`);
  }

}
