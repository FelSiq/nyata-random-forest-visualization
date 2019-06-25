import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DTInterface } from './dt-interface';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class GetModelService {
  private url_get_model = 'http://localhost:5000/dt-visualization';

  constructor(private http: HttpClient) { }

  getDTModel() {
    return this.http.get<DTInterface>(this.url_get_model);
  }
}
