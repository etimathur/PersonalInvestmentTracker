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
  ): Observable<MutualFundSearchResponse> {
    const params = new HttpParams()
      .set('query', searchTerm)

    return this.httpClient.get<MutualFundSearchResponse>(
      'https://personal-investment-tracker-api-azghfvcdb4afhuf8.centralindia-01.azurewebsites.net/api/funds/search',
      { params },
    );
  }
}