import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';


@Component({
  selector: 'app-sidebar-nav',
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.scss']
})
export class SidebarNavComponent implements OnInit {

  bgcolor = 'dark';
  isCollapsed = false;
  isCollapsed_VisAna = true;
  constructor() { }

  public ngOnInit() {
    $('.nav .nav-link').on('click', function() {
         $('.nav').find('.active').removeClass('active');
         $(this).addClass('active');

    });
  }

}
