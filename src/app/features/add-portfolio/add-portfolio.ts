import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MutualFundApiService } from '../../core/services/mutual-fund-api.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-add-portfolio',
  styleUrl: './add-portfolio.scss',
  templateUrl: './add-portfolio.html',
})
export class AddPortfolio {

  public portFolioForm;

  constructor(private FormBuilder: FormBuilder, private portfolioService: PortfolioService, private mutualFundApiService: MutualFundApiService) { 
    this.portFolioForm = this.FormBuilder.group({
      schemeCode: [''],
      fundName: [''],
      monthlyAmount: [''],
      startDate: [''],
      category: [''],
      expectedReturns: ['']
    });
  }

  ngOnInit() { 
    this.mutualFundApiService.getSearchedMutualFunds('Equity').subscribe((response: any) => {
      console.log('Mutual Fund API Response:', response);
    });
  }

  onSubmit() {
    console.log('Form submitted:', this.portFolioForm.value);

    const categoryValue = (this.portFolioForm.value.category as
      | 'Equity'
      | 'Debt'
      | 'Hybrid'
      | 'Gold'
      | 'International'
      | '') || 'Equity';

    this.portfolioService.addPortfolio({
      id: Date.now(), // Simple unique ID based on timestamp
      schemeCode: '',
      fundName: this.portFolioForm.value.fundName || '',
      monthlyAmount: parseFloat(this.portFolioForm.value.monthlyAmount || '0'),
      startDate: new Date(this.portFolioForm.value.startDate || new Date()),
      category: categoryValue,
      expectedReturns: parseFloat(this.portFolioForm.value.expectedReturns || '0')
    });
    this.portFolioForm.reset();
  }
}
