import './App.css';

import React, { useEffect, useState } from 'react';

import { Login } from '../Login';
import { Profile } from '../Profile/Profile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth } from '../types';
import logo from './logo.svg';
import { Discord } from '../Discord';

const LS_KEY = 'login-with-metamask:auth';

interface State {
	auth?: Auth;
}

export const App = (): JSX.Element => {
	const [state, setState] = useState<State>({});

	useEffect(() => {
		// Access token is stored in localstorage
		const ls = window.localStorage.getItem(LS_KEY);
		const auth = ls && JSON.parse(ls);
		setState({ auth });
	}, []);

	const handleLoggedIn = (auth: Auth) => {
		localStorage.setItem(LS_KEY, JSON.stringify(auth));
		setState({ auth });
	};

	const handleLoggedOut = () => {
		localStorage.removeItem(LS_KEY);
		setState({ auth: undefined });
	};

	const { auth } = state;

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<h1 className="App-title">
					Welcome to Login with MetaMask Demo
				</h1>
			</header>
			<div className="App-intro">
				<Router>
					<Routes>
						<Route path="/" element={<Discord />} />
						<Route
							path="/meta_mask_login"
							element={<Login onLoggedIn={handleLoggedIn} />}
						/>
					</Routes>
				</Router>
			</div>
		</div>
	);
};
