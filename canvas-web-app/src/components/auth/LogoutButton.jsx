const LogoutButton = () => {
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <button className="logout-btn" onClick={logout}>
      Tancar sessió
    </button>
  );
};

export default LogoutButton;