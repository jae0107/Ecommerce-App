import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-thankyou',
  templateUrl: './thankyou.component.html',
  styleUrls: ['./thankyou.component.scss']
})
export class ThankyouComponent implements OnInit {
  message: string;
  orderId: number;
  products: any[] = [];
  cartTotal: number;

  constructor(private router: Router, private orderService: OrderService) { 
    const navigation = this.router.getCurrentNavigation();
    //console.log(navigation.extras.state);
    const state = navigation.extras.state as {
      message: string,
      products: ProductResponseModel[],
      orderId: number,
      total: number
    };
    
    this.message = state.message;
    this.orderId = state.orderId;
    this.products = state.products;
    this.cartTotal = state.total;
    //console.log(this.products);
  }

  ngOnInit(): void {
  }

}

interface ProductResponseModel {
  id: number;
  name: string;
  description: string;
  price: number;
  quantityOrdered: number;
  image: string;
}