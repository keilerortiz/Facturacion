export function getApiErrorMessage(error, fallback = 'Ocurrio un error inesperado') {
  if (error.response?.data?.errors?.length) {
    return error.response.data.errors.map((item) => item.message).join(', ');
  }

  return error.response?.data?.message || error.message || fallback;
}
