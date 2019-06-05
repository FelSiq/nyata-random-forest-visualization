import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Config } from './config';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { MessageService } from './message.service';
import { PredConf } from './pred-conf';
import { Pred, FormPred } from './atomos';
import { of } from 'rxjs';


const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})

export class DashService {
  predict_url = 'http://127.0.0.1:5001/predict';

  constructor(private http: HttpClient, private messageService: MessageService) { }

  getPredConfig(): Observable<PredConf[]> {
    return this.http.get<PredConf[]>(this.predict_url)
      .pipe(
        tap(_ => this.log('fetched getPredConfig')),
        catchError(this.handleError('getPredConfig', []))
      );
  }


  private log(message: string) {
    this.messageService.add(message);
  }

  predFormula (formula: FormPred): Observable<Pred> {
    console.log('predFormula:\n');
    console.log(formula);
    return this.http.post<Pred>(this.predict_url, formula, httpOptions).pipe(
      tap((pred: Pred) => this.log(`New prediction w/ pred=${pred}`)),
      catchError(this.handleError<Pred>('new Prediction'))
    );
  }

/**
  * Handle Http operation that failed.
  * Let the app continue.
  * @param operation - name of the operation that failed
  * @param result - optional value to return as the observable result
*/
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
