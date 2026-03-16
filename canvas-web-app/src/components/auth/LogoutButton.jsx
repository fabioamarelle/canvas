const LogoutButton = () => {
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <button className="logout-btn" onClick={logout}>
      Log out
    </button>
  );
};

export default LogoutButton;