import { FluxDispatcher } from "@lib/flux";
import { UserProfileStore, UserStore } from "@lib/stores";
import {
    patchGetPurchase,
    patchGetUserProfile,
    patchUseProfileEffectSections,
    patchUseProfileTheme,
    patchUserProfileEditForm,
    patchNitroUpsellCard
} from "@patches";
import { Settings } from "@ui/pages";

function updateProfileThemeAndEffect() {
    const user = UserStore.getCurrentUser();
    if (!user) return;

    const user_profile = UserProfileStore.getUserProfile(user.id);
    if (!user_profile) return;

    FluxDispatcher.dispatch({
        type: "USER_PROFILE_FETCH_SUCCESS",
        user,
        user_profile,
        connected_accounts: user_profile.connectedAccounts
    });
}

const patches: (() => boolean)[] = [];
let loaded = false;

export default {
    onLoad() {
        if (loaded) return;
        loaded = true;

        try {
            patches.push(
                patchGetPurchase(),
                patchGetUserProfile(),
                ...patchUseProfileEffectSections(),
                patchUseProfileTheme(),
                patchUserProfileEditForm(),
                patchNitroUpsellCard()
            );

            updateProfileThemeAndEffect();
        } catch (error) {
            console.error("[FPTE] Failed to load patches:", error);

            for (const unpatch of patches.splice(0).reverse()) {
                try {
                    unpatch();
                } catch (err) {
                    console.error("[FPTE] Failed to unpatch:", err);
                }
            }

            loaded = false;
        }
    },

    onUnload() {
        if (!loaded) return;
        loaded = false;

        for (const unpatch of patches.splice(0).reverse()) {
            try {
                unpatch();
            } catch (error) {
                console.error("[FPTE] Failed to unpatch:", error);
            }
        }

        updateProfileThemeAndEffect();
    },

    settings: Settings
};
