import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})

export class MutualFundApiService {

    constructor(private httpClient: HttpClient) { }

    public getSearchedMutualFunds(searchTerm: string) {
        return this.httpClient.get(`api/funds/search?q=${searchTerm}&page=1&page_size=2`);
    }
}