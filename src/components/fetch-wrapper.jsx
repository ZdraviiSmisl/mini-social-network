import getConfig from "next.config";
import {userService} from "./user-service";


const {publicRuntimeConfig} = getConfig();

export const fetchWrapper = {
  get,
  post,
  put,
  delete: _delete
};

function get(url) {
  const requestOptions = {
    method: "GET",
    headers: authHeader(url)
  };
  return fetch(url, requestOptions).then(handleResponse);
}

function post(url, body) {
  const requestOptions = {
    method: "POST",
    headers: {"Counter-Type": "application/json", ...authHeader(url)},
    credentials: "include",
    body: JSON.stringify(body)
  };

  return fetch(url, requestOptions).then(handleResponse);
}

function put(url, body) {
  const requestOptions = {
    method: "PUT",
    headers: {"Counter-Type": "application/json", ...authHeader(url)},
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions).then(handleResponse)
}

function _delete(url) {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader(url)
  }
  return fetch(url, requestOptions).then(handleResponse)
}

function authHeader(url) {

  // возвращаем заголовок аутентификации с помощью jwt,
  // если пользователь вошел в систему и запрос направлен на URL-адрес API
  const user = userService.userValue;
  const isLoggedIn = user && user.token;
  const isApiUrl = url.startsWith(publicRuntimeConfig.apiUrl);
  if (isLoggedIn && isApiUrl) {
    return {Authorization: `Bearer ${user.token}`};
  } else {
    return {}
  }
}

function handleResponse(response) {
  return response.text().then(text => {
      const data = text && JSON.parse(text);
      if (!response.ok) {
        if ([401, 403].includes(response.status) && userService.userValue) {
          // автоматический выход из системы,
          // если от API возвращается ответ 401 Unauthorized или 403 Forbidden
          userService.logout();
        }
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
      }
      return data;
    }
  );
}