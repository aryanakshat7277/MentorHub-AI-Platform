import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JitsiScriptService {
  private scriptLoaded = false;
  private scriptLoadingPromise: Promise<boolean> | null = null;

  loadJitsiScript(): Promise<boolean> {
    if (this.scriptLoaded || (window as any).JitsiMeetExternalAPI) {
      this.scriptLoaded = true;
      return Promise.resolve(true);
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };

      script.onerror = (error) => {
        this.scriptLoadingPromise = null;
        reject(error);
      };

      document.body.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }
}
