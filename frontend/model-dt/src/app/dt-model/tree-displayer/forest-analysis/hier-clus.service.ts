import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { HierClus } from './hier-clus';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'credentials': 'include',
  }),
};


@Injectable({
  providedIn: 'root',
})
export class HierClusService {
  private urlGetInstance = 'http://127.0.0.1:5000/forest-hierarchical-clustering';

  constructor(private httpClient: HttpClient) { }

  getHierarchicalClustering(thresholdCut: number, linkage: string, strategy: string): Observable<HierClus> {
    if (!linkage) {
      linkage = 'average';
    }

    const args = {
      'linkage': linkage,
      'threshold_cut': thresholdCut,
      'strategy': strategy,
    }

    return this.httpClient
      .post<HierClus>(this.urlGetInstance, args, httpOptions)
        .pipe(
          retry(3),
          catchError(this.handleErrorGet)
        );
  }

  destroyHierarchicalClustering() {
    this.httpClient.delete(this.urlGetInstance).subscribe();
  }

  cutHierarchicalClustering(thresholdCut: number) {
    const args = {
      'threshold_cut': thresholdCut,
    }

    return this.httpClient
      .put<Array<any>>(this.urlGetInstance, args, httpOptions)
        .pipe(
          retry(3),
          catchError(this.handleErrorCut)
        );
  }

  private handleErrorGet(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while creating the forest hierarchical clustering.`);
    }

  private handleErrorCut(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while cutting the hierarchical cluster dendrogram.`);
    }
}
