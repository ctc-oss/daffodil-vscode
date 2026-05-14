import { EditActionRestrictions } from "ext_types";

class EditorSettings {
    #allowedActions = $state<EditActionRestrictions>(EditActionRestrictions.None)

    get allowedActions() { return this.#allowedActions }
}
