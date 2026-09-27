import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MutualFundSearchResponse } from '../models/mutual-fund.model';

@Injectable({
  providedIn: 'root'
})

export class MutualFundApiService {

  constructor(private httpClient: HttpClient) {}

  public getSearchedMutualFunds(
    searchTerm: string,
    page = 1,
    pageSize = 10,
  ): Observable<MutualFundSearchResponse> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page)
      .set('page_size', pageSize);

    return this.httpClient.get<MutualFundSearchResponse>(
      '/api/funds/search',
      { params },
    );
  }
}