import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({ 
      projectId: "fir-proj-52268", 
      appId: "1:614986491221:web:9c77de199129763cecbbdc", 
      storageBucket: "fir-proj-52268.firebasestorage.app", 
      apiKey: "AIzaSyCdG1lbmd4x2935P0ccgRHN2WLFBgOiSB0", 
      authDomain: "fir-proj-52268.firebaseapp.com", 
      messagingSenderId: "614986491221", 
      measurementId: "G-GBNNVCNW8D",
      databaseURL: "https://fir-proj-52268-default-rtdb.firebaseio.com/"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase())
  ]
};
