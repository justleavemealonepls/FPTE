import { findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import React from "react";

import { getComponentNameFromType, isElement, type RN } from "@lib/reactNativeRenderTree";
import { Builder } from "@ui/components";

const targetNames = ["UserProfileEditForm", "ProfileEditForm", "EditProfileForm"];
const funcParent = targetNames.map(name => findByName(name, false)).find(Boolean);

const isBuilder = (node: RN.Node) => isElement(node) && getComponentNameFromType(node.type) === "Builder";
const textOf = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(textOf).join(" ");
    if (isElement(value)) return textOf(value.props.children);
    return "";
};
const labelOf = (node: RN.Element) => {
    const props = node.props as Record<string, unknown>;
    return [props.label, props.title, props.placeholder, props.accessibilityLabel, props.text, props.children]
        .map(textOf).join(" ").toLowerCase();
};

function inject(tree: RN.Node): boolean {
    const seen = new Set<object>();
    const walk = (node: RN.Node): boolean => {
        if (!node || typeof node !== "object" || seen.has(node as object)) return false;
        seen.add(node as object);
        if (isElement(node)) {
            const children = node.props.children;
            if (Array.isArray(children)) {
                if (children.some(isBuilder)) return true;
                const fieldIndex = children.findIndex(child => {
                    if (!isElement(child)) return false;
                    const name = (getComponentNameFromType(child.type) ?? "").toLowerCase();
                    const label = labelOf(child);
                    return (name.includes("textfield") || name.includes("textinput") || name.includes("bio"))
                        && (label.includes("bio") || label.includes("about me") || name.includes("bio"));
                });
                if (fieldIndex >= 0) {
                    children.splice(fieldIndex + 1, 0, <Builder key="fpte-builder" />);
                    return true;
                }
                // Fallback: insert after the third form text field, as the original plugin did.
                const fieldIndices = children.reduce<number[]>((acc, child, i) => {
                    if (isElement(child)) {
                        const name = (getComponentNameFromType(child.type) ?? "").toLowerCase();
                        if (name.includes("textfield") || name.includes("textinput")) acc.push(i);
                    }
                    return acc;
                }, []);
                if (fieldIndices.length >= 3) {
                    children.splice(fieldIndices[2] + 1, 0, <Builder key="fpte-builder" />);
                    return true;
                }
            }
            if (walk(children)) return true;
        } else if (Symbol.iterator in node) {
            for (const child of node as Iterable<RN.Node>) if (walk(child)) return true;
        }
        return false;
    };
    return walk(tree);
}

export const patchUserProfileEditForm = () => {
    if (!funcParent) {
        console.warn("[FPTE] Profile edit form finder failed; no matching Discord component was found.");
        return () => true;
    }

    return after("default", funcParent, (_args: unknown[], tree: RN.Node) => {
        if (storage.hideBuilder || !tree) return tree;
        try {
            if (!inject(tree)) console.warn("[FPTE] Profile form found, but no suitable Bio/text-field container was found.");
        } catch (error) {
            console.error("[FPTE] Builder injection failed:", error);
        }
        return tree;
    });
};
