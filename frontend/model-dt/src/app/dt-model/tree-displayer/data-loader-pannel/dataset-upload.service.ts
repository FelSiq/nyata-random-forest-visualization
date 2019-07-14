import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};


@Injectable({
  providedIn: 'root'
})
export class DatasetUploadService {
  // private urlPostInstance = 'http://127.0.0.1:5000/predict-dataset/';
  private urlPostInstance = '.';

  constructor(public httpClient: HttpClient) { }

  postFile(fileToUpload: File): Observable<Object> {
    const endpoint = 'your-destination-url';
    const formData: FormData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.httpClient
      .post(endpoint, formData, httpOptions)
      .pipe(
        catchError((e) => this.handleError(e))
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something went wrong while predicting a whole test dataset.');
  }

}
