import { AfterViewInit, Component, ElementRef, Input, ViewChild, } from '@angular/core';
import { isPlatform, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Geolocation as GeolocationCordova } from '@awesome-cordova-plugins/geolocation/ngx';
import { Geolocation as GeolocationCapacitor } from '@capacitor/geolocation';


@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss'],
})
export class GoogleMapsComponent implements AfterViewInit {
  @ViewChild('mapCanvas', { static: true }) mapElement: ElementRef;
  public map: any;
  private googleMaps;
  private currentLat = 0;
  private currentLng = 0;
  private currentPosition: any;

  constructor(
    public platform: Platform,
    private geolocation: GeolocationCordova
  ) { }


  async ngAfterViewInit() {
    this.googleMaps = await this.getGoogleMaps(environment.googleMapsAPIKEY);
    const mapElem = this.mapElement.nativeElement;
    // this.setCurrentPosition(-26.228067, -52.671327);
    await this.getCurrentPosition();
    this.map = new this.googleMaps.Map(mapElem, {
      center: this.currentPosition,
      zoom: 15
    });
    this.addMarker(this.currentLat, this.currentLng, 'You', 'Current Place NOw!');
    this.googleMaps.event.addListenerOnce(this.map, 'idle', () => {
      mapElem.classList.add('show-map');
    });
  }

  public addMarker(lat: number, lng: number, title = '', contentInfo = '', zoom = 15): void {
    const latLng = new this.googleMaps
      .LatLng(lat, lng);
    const infoWindow = new this.googleMaps.InfoWindow({
      content: contentInfo
    });
    const marker = new this.googleMaps.Marker({
      position: latLng,
      map: this.map,
      title
    });
    if (contentInfo) {
      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });
    }
  }

  public async getCurrentPosition(): Promise<void> {
    const coordinates = {
      latitude: 0,
      longitude: 0
    };
    if (isPlatform('ios') || isPlatform('android')) {
      await GeolocationCapacitor.getCurrentPosition().then((resp) => {
        coordinates.latitude = resp.coords.latitude;
        coordinates.longitude = resp.coords.longitude;
        console.log('using capacitor Geolocation');
      }).catch((error) => {
        console.log('Error getting location', error);
      });
    } else {
      await this.geolocation.getCurrentPosition().then((resp) => {
        coordinates.latitude = resp.coords.latitude;
        coordinates.longitude = resp.coords.longitude;
        console.log('using cordova Geolocation');

      }).catch((error) => {
        console.log('Error getting location', error);
      });
    }
    this.setCurrentPosition(coordinates.latitude, coordinates.longitude);
  }

  public setCurrentPosition(lat: number, lng: number): void {
    this.currentLat = lat;
    this.currentLng = lng;
    this.currentPosition = new this.googleMaps.LatLng(lat, lng);
  }

  private async getGoogleMaps(apiKey: string): Promise<any> {
    const win = window as any;
    const googleModule = win.google;
    if (googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=quarterly`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        const googleModule2 = win.google;
        if (googleModule2 && googleModule2.maps) {
          resolve(googleModule2.maps);
        } else {
          reject('Google Maps is not available.');
        }
      };
    });
  }
}
