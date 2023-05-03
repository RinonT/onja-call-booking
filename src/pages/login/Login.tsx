import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Divider, Snackbar, Typography } from '@mui/material';
import { LoginSocialGoogle, IResolveParams } from 'reactjs-social-login';
import GoogleIcon from '@mui/icons-material/Google';
import { useCookies } from 'react-cookie';
import { add } from 'date-fns';

import { HOME, LOGIN } from '../../constants/paths';

import { loginMutation, sendQuery } from "../../graphqlHelper";
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setCurrentUser, setUserLoggedIn } from '../../redux/reducers/usersSlice';
import { setErrorMessage } from '../../redux/reducers/errorMessage';

import styles from './login.module.css';
import Spinner from '../../components/UIs/spinner/Spinner';

const {
  container, heading, alert, paragraph, buttonWrapper,
  googleButton, divider, googleIcon, logoutText
} = styles;

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [cookies, setCookie, removeCookie] = useCookies(['currentUser', 'isLoggedOut']);
  const { errorMessage } = useAppSelector((state) => state.errorMessage);
  const [isLoading, setIsLoading] = useState(false);

  const onLoginResolve = async ({ data }: IResolveParams) => {
    try {
      if (data) {
        setIsLoading(true);
        const { name, email, sub, access_token, picture, hd, expires_in } = data;
        if (hd === 'onja.org') {
          const res = await sendQuery(loginMutation(name, email, sub, access_token, picture, hd, expires_in));
          dispatch(setCurrentUser(res.data.data));
          dispatch(setUserLoggedIn(true));
          setCookie('currentUser', res.data.data, { path: HOME, expires: add(new Date(), { weeks: 1 }) });
          removeCookie('isLoggedOut', { path: HOME });
          navigate(HOME);
        } else {
          setIsLoading(false);
          dispatch(setErrorMessage('Email domain not allowed. You must be under onja.org domain in order to log in.'));
        }
      }
    } catch (error) {
      dispatch(setErrorMessage(error));
      setIsLoading(false);
    }
  };

  const renderLoginText = () => {
    if (cookies.isLoggedOut) {
      return (
        <Typography
          className={`${location.pathname !== LOGIN ? logoutText : ''} ${paragraph}`}
        >
          You are currently logged out. In order to use this app, log in with your Onja google account.
        </Typography>
      );
    }

    return (
      <Typography className={paragraph}>
        Welcome to Onja Call Booking App!
        <span>
          {cookies?.currentUser?.login ?
            `You are currently logged in with ${cookies.currentUser?.login?.email}. You can create another account using a different Onja Google account`
            : `Before you see the calendar, please sign in with your Onja google account.`
          }
        </span>
      </Typography>
    );
  };

  return (
    <Box className={container}>
      {location.pathname === LOGIN && <Typography className={heading} variant='h3'>Log in</Typography>}
      {renderLoginText()}

      {!isLoading ?
        <Box className={buttonWrapper}>
          <LoginSocialGoogle
            client_id={process.env.REACT_APP_GG_APP_ID || ''}
            redirect_uri={process.env.REDIRECT_URI}
            scope="openid profile email"
            discoveryDocs="claims_supported"
            access_type="offline"
            onResolve={onLoginResolve}
            onReject={error => dispatch(setErrorMessage(error))}
          >
            <Button
              startIcon={<GoogleIcon className={googleIcon} />}
              className={googleButton}
            >
              Log in with Google
            </Button>
          </LoginSocialGoogle>
        </Box> : <Spinner action='Loading...' />}


      <Divider orientation='horizontal' className={divider} />
      <Typography className={paragraph}>
        If you don’t have a Google account yet, please contact the Onja google workspace administrators to create one for you.
      </Typography>
      {!!errorMessage && (
        <Snackbar
          open
          autoHideDuration={6000}
          onClose={() => dispatch(setErrorMessage(null))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          key={'bottom right'}
        >
          <Alert severity="error" className={alert}>
            {typeof errorMessage === 'string' ? errorMessage : `An error has occured when trying to log in with google. Please try again but if it persists, contact one of the devs.`}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Login;
