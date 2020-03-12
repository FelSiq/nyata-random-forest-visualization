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
  private urlResource = 'http://127.0.0.1:5000/most-common-attr-seq';

  constructor(private httpClient: HttpClient) { }

  getMostCommonAttrSeq(attrNum: number, includeDecision: boolean): Observable<HierClus> {

    const args = {
      'seq_num': attrNum.toString(),
      'include_node_decision': includeDecision ? '1' : '0',
    }

    return this.httpClient
    .post<HierClus>(this.urlResource, args, httpOptions)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  destroy() { 
    this.httpClient.delete(this.urlResource).subscribe(); 
  } 

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while calculating the most common attribute sequence ranking.
       Please check your instance values are correct.`);
    }

}
