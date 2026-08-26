import { useAuth } from "../../context/useAuth";

export default function CanAccess({
    permission,
    anyPermissions,
    allPermissions,
    fallback = null,
    children,
}) {
    const {
        canAccess,
    } = useAuth();

    const allowed =
        canAccess({
            permission,
            anyPermissions,
            allPermissions,
        });

    if (!allowed) {
        return fallback;
    }

    return typeof children ===
        "function"
        ? children({
              allowed,
          })
        : children;
}