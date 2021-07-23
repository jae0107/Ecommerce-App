import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
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
              private router: Router,
              private spinner: NgxSpinnerService,
              private toast: ToastrService) { 

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

  AddProductToCart(id: number, quantity?: number) {
    this.productService.getSingleProduct(id).subscribe(prod => {
      // If the cart is empty
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart = quantity !== undefined ? quantity : 1;
        //TODO calculate total amount
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ...this.cartDataServer });
        // Todo display a toast notification

      } else { // If cart is not empty
        let index = this.cartDataServer.data.findIndex(p => p.product.id === prod.id); // -1 or positive value

        //If chosen product is already in cart array => index is positive value
        if (index !== -1) {
          if (quantity !== undefined && quantity <= prod.quantity) {
            this.cartDataServer.data[index].numInCart = this.cartDataServer.data[index].numInCart < prod.quantity ? quantity : prod.quantity;
          
          } else {
            this.cartDataServer.data[index].numInCart < this.cartDataServer.data[index].numInCart ? this.cartDataServer.data[index].numInCart++ : prod.quantity;
            //this.cartDataServer.data[index].numInCart < prod.quantity ? this.cartDataServer.data[index].numInCart++ : prod.quantity;
          }

          this.cartDataClient.prodData[index].incart = this.cartDataServer.data[index].numInCart;
          // Todo display a toast notification

        } else { //If chosen product is not in cart array
          this.cartDataServer.data.push({
            product: prod,
            numInCart: 1
          });

          this.cartDataClient.prodData.push({
            incart: 1,
            id: prod.id
          });

          // Todo display a toast notification

          //TODO calculate total amount

          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          this.cartData$.next({ ...this.cartDataServer });
        }
        /*this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ...this.cartDataServer });*/
      }
    });
  }

  UpdateCartData(index: number, increase: boolean) {
    let data = this.cartDataServer.data[index];

    if (increase) {
      data.numInCart < data.product.quantity ? data.numInCart++ : data.product.quantity;
      this.cartDataClient.prodData[index].incart = data.numInCart;
      //TODO calculate total amount
      this.cartDataClient.total = this.cartDataServer.total;
      this.cartData$.next({ ...this.cartDataServer });
      localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

    } else {
      data.numInCart--;

      if (data.numInCart < 1) {
        //TODO delete the product from cart
        this.cartData$.next({...this.cartDataServer});
        
      } else {
        this.cartData$.next({...this.cartDataServer});
        this.cartDataClient.prodData[index].incart = data.numInCart;
        //TODO calculate total amount
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }
    }
  }

  DeleteProductFromCart(index: number) {
    if (window.confirm('Are you sure you want to delete the item?')) {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);
      //TODO calculate total amount
      this.cartDataClient.total = this.cartDataServer.total;

      if (this.cartDataClient.total === 0) {
        this.cartDataClient = { prodData: [{ incart: 0, id: 0 }], total: 0 };
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

      } else {
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }

      if (this.cartDataServer.total === 0) {
        this.cartDataServer = {
          data: [{
            product: undefined,
            numInCart: 0
          }],
          total: 0
        };
        this.cartData$.next({ ...this.cartDataServer });

      } else {
        this.cartData$.next({ ...this.cartDataServer });
      }

    } else { // If the user doesn't want to delete the product, hits the CANCEL button
      return;
    }
  }

  private CalculateTotal() {
    let Total = 0;

    this.cartDataServer.data.forEach(p => {
      const { numInCart } = p;
      const { price } = p.product;
      Total += numInCart * price;
    });

    this.cartDataServer.total = Total;
    this.cartTotal$.next(this.cartDataServer.total);
  }

  CheckoutFromCart(userId: number) {
    this.http.post(`${this.serverURL}/orders/payment`, null).subscribe((res: { success: boolean }) => {
      if (res.success) {
        this.resetServerData();
        this.http.post(`${this.serverURL}orders/new`,{
          userId: userId, 
          products: this.cartDataClient.prodData
        }).subscribe((data: OrderConfirmationResponse) => {
          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if (data.success) {
              const navigationExtras: NavigationExtras = {
                state: {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.cartDataClient.total
                }
              };

              this.spinner.hide().then();
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.cartDataClient = { prodData: [{ incart: 0, id: 0 }], total: 0 };
                this.cartTotal$.next(0);
                localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
              });
            }
          });
        });

      } /*else {
        this.spinner.hide().then();
        this.router.navigateByUrl('/checkout').then();
        this.toast.error(`Sorry, failed to book the order`, "Order Status", {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      }*/
    });
  }

  private resetServerData() {
    this.cartDataServer = {
      data: [{
        product: undefined,
        numInCart: 0
      }],
      total: 0
    };
    this.cartData$.next({ ...this.cartDataServer });
  }
}

interface OrderConfirmationResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [{
    id: string,
    numInCart: string
  }];
}



