import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MutualFundApiService } from './mutual-fund-api.service';

describe('MutualFundApiService', () => {
  let service: MutualFundApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MutualFundApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MutualFundApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('sends the search term and explicit paging parameters', () => {
    service.getSearchedMutualFunds('equity', 1, 10).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/funds/search',
    );
    expect(request.request.params.get('q')).toBe('equity');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('page_size')).toBe('10');
    request.flush({ results: [] });
  });
});
