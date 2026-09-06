function requireRole(requiredRole) {
    const session = JSON.parse(
        localStorage.getItem("DS_SESSION")
    );

    // Not logged in
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // Wrong dashboard
    if (session.role !== requiredRole) {
        if (session.role === "citizen") {
            window.location.href = "citizen.html";
        } else {
            window.location.href = "authority.html";
        }
    }
}