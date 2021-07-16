import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';


const httpOptions = {
  withCredentials: true,
  // headers: new HttpHeaders({ 'Content-Type': 'multipart/form-data' }),
};

@Injectable({
  providedIn: 'root'
})
export class ModelLoaderService {
  private urlResourcePost = 'http://127.0.0.1:5000/dt-visualization';

  constructor(public httpClient: HttpClient) { }

  postFile(fileToUpload: File) {
    const formData: FormData = new FormData();
    formData.append('file', fileToUpload[0]);

    return this.httpClient
      .post(this.urlResourcePost, formData, httpOptions)
      .pipe(
        catchError((e) => this.handleError(e))
      );
  }

  destroy() { 
    this.httpClient.delete(this.urlResourcePost, httpOptions).subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while posting the model to the backend.`);
  }

}
