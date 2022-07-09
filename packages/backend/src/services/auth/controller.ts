import { recoverPersonalSignature } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';

import { config } from '../../config';
import { User } from '../../models/user.model';

export const create = (req: Request, res: Response, next: NextFunction) => {
	const { signature, publicAddress, code } = req.body;
	if (!signature || !publicAddress)
		return res
			.status(400)
			.send({ error: 'Request should have signature and publicAddress' });

	return (
		User.findOne({ where: { publicAddress } })
			////////////////////////////////////////////////////
			// Step 1: Get the user with the given publicAddress
			////////////////////////////////////////////////////
			.then((user: User | null) => {
				if (!user) {
					res.status(401).send({
						error: `User with publicAddress ${publicAddress} is not found in database`,
					});

					return null;
				}

				return user;
			})
			////////////////////////////////////////////////////
			// Step 2: Verify digital signature
			////////////////////////////////////////////////////
			.then((user: User | null) => {
				if (!(user instanceof User)) {
					// Should not happen, we should have already sent the response
					throw new Error(
						'User is not defined in "Verify digital signature".'
					);
				}

				const msg = `I am signing my one-time nonce: ${user.nonce}`;

				// We now are in possession of msg, publicAddress and signature. We
				// will use a helper from eth-sig-util to extract the address from the signature
				const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
				const address = recoverPersonalSignature({
					data: msgBufferHex,
					sig: signature,
				});

				// The signature verification is successful if the address found with
				// sigUtil.recoverPersonalSignature matches the initial publicAddress
				if (address.toLowerCase() === publicAddress.toLowerCase()) {
					return user;
				} else {
					res.status(401).send({
						error: 'Signature verification failed',
					});

					return null;
				}
			})
			////////////////////////////////////////////////////
			// Step 3: Generate a new nonce for the user
			////////////////////////////////////////////////////
			.then((user: User | null) => {
				if (!(user instanceof User)) {
					// Should not happen, we should have already sent the response

					throw new Error(
						'User is not defined in "Generate a new nonce for the user".'
					);
				}

				user.nonce = Math.floor(Math.random() * 10000);
				return user.save();
			})
			////////////////////////////////////////////////////
			// Step 4: Create JWT
			////////////////////////////////////////////////////
			.then((user: User) => {
				return new Promise<string>((resolve, reject) =>
					// https://github.com/auth0/node-jsonwebtoken
					jwt.sign(
						{
							payload: {
								id: user.id,
								publicAddress,
							},
						},
						config.secret,
						{
							algorithm: config.algorithms[0],
						},
						(err, token) => {
							if (err) {
								return reject(err);
							}
							if (!token) {
								return new Error('Empty token');
							}
							return resolve(token);
						}
					)
				);
			})
			.then((accessToken: string) => {
				const getDiscordUserInfo = async () => {
					const params = new FormData();
					params.append('client_id', '994829575076978762');
					params.append(
						'client_secret',
						'NFn1gZ7H4WLLePYolK4b0wqbanEh9_5g'
					);
					params.append('grant_type', 'authorization_code');
					params.append('code', code);
					params.append(
						'redirect_uri',
						'http://localhost:3000/meta_mask_login'
					);

					const headers = {
						'Content-Type': 'application/x-www-form-urlencoded',
					};
					const response = await axios.post(
						'https://discordapp.com/api/oauth2/token',
						params,
						{ headers: headers }
					);

					const userHeaders = {
						Authorization:
							'Bearer ' + String(response.data.access_token),
					};
					const userResponse = await axios.get(
						'https://discordapp.com/api/users/@me',
						{ headers: userHeaders }
					);

					return userResponse.data;
				};

				getDiscordUserInfo().then((discordUserInfo) => {
					return res.json({
						accessToken,
						discordUserInfo: discordUserInfo,
					});
				});
			})
			.catch(next)
	);
};
