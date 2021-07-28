import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';
import { map } from "rxjs/operators";
import { ProductModelServer } from 'src/app/models/product.model';

declare let $: any;

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, AfterViewInit {
  id: number;
  product;
  thumbimages: any[] = [];
  related_products: any[] = [];
  //related_products: ProductModelServer[] = [];

  @ViewChild('quantity') quantityInput;

  constructor(private route: ActivatedRoute,
              private productService: ProductService,
              private cartService: CartService,
              private router: Router) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map((param: ParamMap) => {
        // @ts-ignore
        return param.params.id;
      })
    ).subscribe(prodId => {
      this.id = prodId;
      
      this.productService.getSingleProduct(this.id).subscribe(prod => {
        this.product = prod;
        //console.log(this.product.category);
        if (prod.images !== null) {
          //console.log(this.product);
          this.thumbimages = prod.images.split(';');
        }

        this.productService.getProductsFromCategory(this.product.category).subscribe((same_cat: any) => {
          this.related_products = same_cat.products;
          this.related_products = this.related_products.filter(i => {
            return i.id !== this.product.id;
          });
          //console.log(this.product.category, this.related_products);
        });
      });
    });
  }

  ngAfterViewInit(): void {
    // Product Main img Slick
    $('#product-main-img').slick({
      infinite: true,
      speed: 300,
      dots: false,
      arrows: true,
      fade: true,
      asNavFor: '#product-imgs',
    });

    // Product imgs Slick
    $('#product-imgs').slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      arrows: true,
      centerMode: true,
      focusOnSelect: true,
      centerPadding: 0,
      vertical: true,
      asNavFor: '#product-main-img',
      responsive: [{
        breakpoint: 991,
        settings: {
          vertical: false,
          arrows: false,
          dots: true,
        }
      },
      ]
    });

    // Product img zoom
    let zoomMainProduct = document.getElementById('product-main-img');
    if (zoomMainProduct) {
      $('#product-main-img .product-preview').zoom();
    }
  }

  addToCart(id: number) {
    this.cartService.AddProductToCart(id, this.quantityInput.nativeElement.value);
  }

  Increase() {
    let value = parseInt(this.quantityInput.nativeElement.value);

    if (this.product.quantity >= 1){
      value++;

      if (value > this.product.quantity) {
        value = this.product.quantity;
      }

    } else {
      return;
    }

    this.quantityInput.nativeElement.value = value.toString();
  }

  Decrease() {
    let value = parseInt(this.quantityInput.nativeElement.value);
    if (this.product.quantity > 0){
      value--;

      if (value <= 0) {
        value = 0;
      }

    } else {
      return;
    }

    this.quantityInput.nativeElement.value = value.toString();
  }

  selectProduct(id: number) {
    this.router.navigate(['/product', id]).then();

  }
}
