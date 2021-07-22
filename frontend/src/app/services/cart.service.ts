import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CartModelPublic, CartModelServer } from '../models/cart.model';
import { ProductModelServer } from '../models/product.model';
import { OrderService } from './order.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private serverURL = environment.SERVER_URL;

  // Cart Data variable to store the cart information on the client's local storage
  private cartDataClient: CartModelPublic = {
    total: 0,
    prodData: [{
      incart: 0,
      id: 0
    }]
  };

  // Data variable to store the cart information on the server
  private cartDataServer: CartModelServer = {
    total: 0,
    data: [{
      numInCart: 0,
      product: undefined
    }]
  };

  // Observables for the components to subscribe
  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);

  constructor(private http: HttpClient, 
              private productService: ProductService, 
              private orderService: OrderService,
              private router: Router) { 

    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);

    //Get the information from local storage if any
    let info: CartModelPublic = JSON.parse(localStorage.getItem('cart') as string);

    //check if the info variable is null or has some data in it
    if (info !== null && info !== undefined && info.prodData[0].incart !== 0) {
      //Local storage is not empty and has some information
      this.cartDataClient = info;

      // Loop through each entry and put it in the cartDataServer object
      this.cartDataClient.prodData.forEach(p => {
        this.productService.getSingleProduct(p.id).subscribe((actualProductInfo: ProductModelServer) => {
          if (this.cartDataServer.data[0].numInCart === 0) {
            this.cartDataServer.data[0].numInCart = p.incart;
            this.cartDataServer.data[0].product = actualProductInfo;
            // TODO create CalculateTotal fuction and replace it
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

          } else {
            // CartDataServer already has some entry in it
            this.cartDataServer.data.push({
              numInCart: p.incart,
              product: actualProductInfo
            });

            // TODO create CalculateTotal fuction and replace it
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          }
          this.cartData$.next({ ...this.cartDataServer });
        });
      });
    }
  }
}
