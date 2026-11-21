import { findByPropsAll } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

import { ProfileEffectRecord } from "@lib/records";
import { type ProfileEffect, ProfileEffectStore } from "@lib/stores";
import { previewUserId } from "@patches/patchUseProfileTheme";

const useSectionModules = findByPropsAll("NONE_ITEM");

let prevProfileEffects: ProfileEffect[] | undefined;
let prevSections: Record<string, any>[] | undefined;

export const patchUseProfileEffectSections = () => useSectionModules.map(
    sectionModule => after("default", sectionModule, (_args: unknown[], origSections: Record<string, any>[] | undefined) => {
        if (!previewUserId || !Array.isArray(origSections) || !origSections[0])
            return origSections;

        const currProfileEffects = ProfileEffectStore.profileEffects;
        if (currProfileEffects === prevProfileEffects && prevSections)
            return prevSections;

        const firstSection = origSections[0];
        if (!Array.isArray(firstSection.items))
            return origSections;

        const defaultItem = firstSection.items[0];
        const sections = [{
            ...firstSection,
            items: [
                ...(defaultItem === undefined ? [] : [defaultItem]),
                ...currProfileEffects.map(effect => new ProfileEffectRecord(effect))
            ]
        }];

        prevProfileEffects = currProfileEffects;
        prevSections = sections;
        return sections;
    })
);
