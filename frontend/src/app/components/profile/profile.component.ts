import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocialAuthService, SocialUser } from 'angularx-social-login';
import { map } from 'rxjs/operators';
import { ResponseModel, UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  myUser: any;

  constructor(private authService: SocialAuthService,
              private userService: UserService,
              private router: Router) { }

  ngOnInit(): void {
    this.userService.userData$
    .pipe(
      map((user: SocialUser | ResponseModel) => {
        //console.log(user);
        if (user instanceof SocialUser || user.type === 'social') {
          return {
            ...user
          };

        } else {
          return user;
        }
      })
    )
    .subscribe((data: ResponseModel | SocialUser) => {
      this.myUser = data;
    });
  }

  logout() {
    this.userService.logout();
  }
}
