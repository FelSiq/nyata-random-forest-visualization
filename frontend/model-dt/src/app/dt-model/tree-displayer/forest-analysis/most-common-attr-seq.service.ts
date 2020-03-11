import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { HierClus } from './hier-clus';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({ 'Content-Type': 'application/json', 'credentials': 'include' }),
};

@Injectable({
  providedIn: 'root',
})
export class MostCommonAttrSeqService {
  private urlPostInstance = 'http://127.0.0.1:5000/most-common-attr-seq/';

  constructor(private httpClient: HttpClient) { }

  getMostCommonAttrSeq(attrNum: number, includeDecision: boolean): Observable<HierClus> {
    return this.httpClient
    .get<HierClus>(this.urlPostInstance + attrNum.toString() + '/' + (includeDecision ? '1' : '0'), httpOptions)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while calculating the most common attribute sequence ranking.
       Please check your instance values are correct.`);
    }

}
