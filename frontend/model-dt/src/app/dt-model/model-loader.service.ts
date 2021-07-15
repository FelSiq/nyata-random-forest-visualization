import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  withCredentials: true,
  // headers: new HttpHeaders({ 'Content-Type': 'multipart/form-data' }),
};

@Injectable({
  providedIn: 'root'
})
export class ModelLoaderService {
  private urlResource = 'http://127.0.0.1:5000/dt-visualization';

  constructor(public httpClient: HttpClient) { }

  postFile(fileToUpload: File) {
    const formData: FormData = new FormData();
    formData.append('file', fileToUpload[0]);

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
    console.log(error.error);
    return throwError(
      `Something went wrong while posting the model to the backend.`);
  }

}
