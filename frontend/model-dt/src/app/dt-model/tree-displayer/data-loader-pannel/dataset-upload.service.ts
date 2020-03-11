import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PredictResults } from '../predict-results';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class DatasetUploadService {
  private urlPostInstance = 'http://127.0.0.1:5000/predict-dataset';

  constructor(public httpClient: HttpClient) { }

  postFile(fileToUpload: File,
           sep: string,
           hasHeader: boolean,
           hasClasses: boolean): Observable<PredictResults> {
    const endpoint = this.urlPostInstance;

    const formData: FormData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('sep', sep);
    formData.append('hasHeader', hasHeader ? 'True' : 'False');
    formData.append('hasClasses', hasClasses ? 'True' : 'False');

    return this.httpClient
      .post(endpoint, formData)
      .pipe(
        catchError((e) => this.handleError(e))
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while predicting a whole test dataset.
       Please check if given custom options corresponds to the dataset format,
       and if the given dataset is correctly formatted.`);
  }

}
