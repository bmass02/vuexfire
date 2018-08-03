import * as Vuex from 'vuex';
import * as firebase from 'firebase';
export declare const firebaseMutations: Record<string, any>;
export declare namespace VuexFire {
    interface BindOptions {
        /**
         * Cancel callback passed to Firebase when listening for events
         */
        cancelCallback?: Function;

        /**
         * (Arrays only) Should Vuexfire wait for the whole array to be populated. Defaults to true
         */
        wait?: boolean;
    }

    interface FirestoreBindOptions extends BindOptions {
        /**
         * Should Watcher receive events for Metadata changes. Defaults to true.
         */
        includeMetadataChanges?: boolean;
    }

    interface ActionContext<S, R> extends Vuex.ActionContext<S, R> {
        /**
         * Binds a Firebase Reference to a property in the state. If there was already another reference bound to the same property, it unbinds it first.
         */
        bindFirebaseRef: (key: string, source: firebase.database.Reference | firebase.database.Query, options?: BindOptions) => Promise<firebase.database.DataSnapshot>;

        /**
         * Binds a Firestore Reference to a property in the state. If there was already another reference bound to the same property, it unbinds it first.
         */
        bindFirestoreRef: (key: string, source: firebase.firestore.CollectionReference | firebase.firestore.Query, options?: FirestoreBindOptions) => Promise<firebase.firestore.QuerySnapshot>;
        bindFirestoreRef: (key: string, source: firebase.firestore.DocumentReference, options?: FirestoreBindOptions) => Promise<firebase.firestore.DocumentSnapshot>;

        /**
         * Unbinds a bound firebase reference to a given property in the state.
         */
        unbind: (key: string) => void;
    }
}
export declare function firebaseAction<S, R>(action: (context: VuexFire.ActionContext<S, R>, payload: any) => any): (context: Vuex.ActionContext<S, R>, payload: any) => any;
