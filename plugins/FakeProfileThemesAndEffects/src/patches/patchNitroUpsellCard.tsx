import { findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { isElement, getComponentNameFromType, type RN } from "@lib/reactNativeRenderTree";

const funcParent = findByName("UserProfileEditForm", false);

function removeNitroCards(node: RN.Node): RN.Node | null {
    if (node == null) return node;

    if (isElement(node) && getComponentNameFromType(node.type) === "UserProfilePremiumUpsellCard")
        return null;

    if (isElement(node) && node.props?.children != null) {
        const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
        const filtered = children
            .map(removeNitroCards)
            .filter((child): child is RN.Node => child !== null);
        node.props.children = filtered.length === 1 ? filtered[0] : filtered;
    }

    return node;
}

export const patchNitroUpsellCard = () => {
    if (!funcParent) return () => true;

    return after("default", funcParent, (_args: unknown[], tree: RN.Node) =>
        removeNitroCards(tree) ?? tree
    );
};
