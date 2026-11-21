import { findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import React from "react";

import { findParentInTree, getComponentNameFromType, isElement, type RN } from "@lib/reactNativeRenderTree";
import { Builder } from "@ui/components";

const funcParent = findByName("UserProfileEditForm", false);

export const patchUserProfileEditForm = () => {
    if (!funcParent) return () => true;

    return after("default", funcParent, (_args: unknown[], tree: RN.Node) => {
        if (storage.hideBuilder || !tree) return tree;

        const parent = findParentInTree(tree, (children): children is RN.Node[] =>
            Array.isArray(children) && children.some(child =>
                isElement(child) &&
                getComponentNameFromType(child.type) === "UserProfileEditFormTextField"
            )
        );

        if (!parent || !Array.isArray(parent.props.children)) return tree;

        const children = parent.props.children;
        if (children.some(child => isElement(child) && getComponentNameFromType(child.type) === "Builder"))
            return tree;

        const fields = children.reduce<number[]>((acc, child, i) => {
            if (isElement(child) && getComponentNameFromType(child.type) === "UserProfileEditFormTextField")
                acc.push(i);
            return acc;
        }, []);

        if (fields.length >= 3)
            children.splice(fields[2] + 1, 0, <Builder key="fpte-builder" />);

        return tree;
    });
};
