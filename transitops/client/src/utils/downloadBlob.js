function fallbackReportName(extension) {
  return `transitops-vehicle-report-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export function getDownloadFileName(contentDisposition, extension) {
  if (!contentDisposition) {
    return fallbackReportName(extension);
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]).replace(/[\\/:*?"<>|]/g, "-");
  }

  const regularMatch = contentDisposition.match(/filename="?([^";]+)"?/);

  return (regularMatch?.[1] || fallbackReportName(extension)).replace(
    /[\\/:*?"<>|]/g,
    "-"
  );
}

export function downloadBlobResponse({ response, fallbackType, extension }) {
  const contentType = response.headers["content-type"] || fallbackType;
  const blob = new Blob([response.data], {
    type: contentType,
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = getDownloadFileName(
    response.headers["content-disposition"],
    extension
  );

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export async function getBlobErrorMessage(requestError, fallbackMessage) {
  if (requestError.response?.data instanceof Blob) {
    try {
      const errorText = await requestError.response.data.text();
      const errorData = JSON.parse(errorText);

      return errorData.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return requestError.response?.data?.message || fallbackMessage;
}