import './Discord.css';

import React, { useState } from 'react';

export const Discord = (): JSX.Element => {
	const [loading, setLoading] = useState(false); // Loading button state

	return (
		<div>
			<p>
				Please select your login method.
				<br />
				For the purpose of this demo, only MetaMask login is
				implemented.
			</p>
			<button className="Login-button Login-mm">
				<a href="https://discord.com/api/oauth2/authorize?client_id=994829575076978762&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fmeta_mask_login&response_type=code&scope=identify">
					Login Discord
				</a>
			</button>
		</div>
	);
};
