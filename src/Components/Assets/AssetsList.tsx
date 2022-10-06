import { useDispatch } from "react-redux";
import QrReader from "react-qr-reader";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import {
  getAnyFacility,
  listAssets,
  getFacilityAssetLocation,
} from "../../Redux/actions";
import { assetClassProps, AssetData } from "./AssetTypes";
import { getAsset } from "../../Redux/actions";
import React, { useState, useCallback, useEffect } from "react";
import { navigate, useQueryParams } from "raviger";
import loadable from "@loadable/component";
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import { make as SlideOver } from "../Common/SlideOver.gen";
import CircularProgress from "@material-ui/core/CircularProgress";
import AssetFilter from "./AssetFilter";
import AdvancedFilterButton from "../Common/AdvancedFilterButton";
import { parseQueryParams } from "../../Utils/primitives";
import { Badge } from "../Common/Badge";

const Loading = loadable(() => import("../Common/Loading"));

interface qParamModel {
  search?: string;
  facility?: string;
  asset_type?: string;
  location?: string;
  status?: string;
}

const AssetsList = () => {
  const [qParams, setQueryParams] = useQueryParams();
  const [assets, setAssets] = useState<AssetData[]>([{}] as AssetData[]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [facilityName, setFacilityName] = useState<string>();
  const [asset_type, setAssetType] = useState<string>();
  const [locationName, setLocationName] = useState<string>();
  const limit = 24;
  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = qParams.search
        ? {
            limit,
            offset,
            search_text: qParams.search,
            facility: qParams.facility,
            asset_type: qParams.asset_type,
            location: qParams.location,
            status: qParams.status,
          }
        : {
            limit,
            offset,
            facility: qParams.facility,
            asset_type: qParams.asset_type,
            location: qParams.location,
            status: qParams.status,
          };
      const { data }: any = await dispatch(listAssets(params));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssets(data.results);
          setTotalCount(data.count);
        }
      }
    },
    [
      dispatch,
      offset,
      qParams.search,
      qParams.facility,
      qParams.asset_type,
      qParams.location,
      qParams.status,
    ]
  );

  useEffect(() => {
    setAssetType(qParams.asset_type);
  }, [qParams.asset_type]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const fetchFacilityName = useCallback(
    async (status: statusType) => {
      if (qParams.facility) {
        setIsLoading(true);

        const res = await dispatch(getAnyFacility(qParams.facility));

        if (!status.aborted) {
          setFacilityName(res?.data?.name);
          setIsLoading(false);
        }
      } else {
        setFacilityName("");
      }
    },
    [dispatch, qParams.facility]
  );
  const fetchLocationName = useCallback(
    async (status: statusType) => {
      if (qParams.location) {
        setIsLoading(true);
        const res = await dispatch(
          getFacilityAssetLocation(qParams.facility, qParams.location)
        );
        if (!status.aborted) {
          setLocationName(res?.data?.name);
          setIsLoading(false);
        }
      } else {
        setLocationName("");
      }
    },
    [dispatch, qParams.location]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchFacilityName(status);
      fetchLocationName(status);
    },
    [fetchFacilityName, fetchLocationName]
  );

  const badge = (key: string, value: any, paramKey: string[]) => {
    return (
      value && (
        <span className="inline-flex h-full items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={() => removeFilter(paramKey)}
          ></i>
        </span>
      )
    );
  };

  const removeFilter = (paramKey: string[]) => {
    const emptyObj: qParamModel = { ...qParams };
    paramKey.forEach((p) => ((emptyObj as any)[p] = ""));
    updateQuery({
      ...emptyObj,
    });
  };

  const onSearchSuspects = (search: string) => {
    if (search !== "")
      setQueryParams({ ...qParams, search }, { replace: true });
    else setQueryParams({ ...qParams, search: "" }, { replace: true });
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, { replace: true });
    console.log(qParams);
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  const getAssetIdFromQR = async (assetUrl: string) => {
    try {
      setIsLoading(true);
      setIsScannerActive(false);
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        const { data }: any = await dispatch(
          listAssets({ qr_code_id: assetId })
        );
        return data.results[0].id;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const checkValidAssetId = async (assetId: any) => {
    const assetData: any = await dispatch(getAsset(assetId));
    try {
      if (assetData.data) {
        navigate(`/assets/${assetId}`);
      }
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      Notification.Error({
        msg: "Invalid QR code scanned !!!",
      });
    }
  };

  if (isScannerActive)
    return (
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={async (value: any) => {
            if (value) {
              const assetId = await getAssetIdFromQR(value);
              checkValidAssetId(assetId ?? value);
            }
          }}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="text-center text-lg self-center">Scan Asset QR!</h2>
      </div>
    );

  return (
    <div className="px-6">
      <PageTitle title="Assets" hideBack={true} breadcrumbs={false} />
      <div className="lg:flex mt-5 space-y-2 space-x-2">
        <div className="bg-white overflow-hidden shadow rounded-lg flex-1 md:mr-2">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Assets
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="flex-1">
          <InputSearchBox
            value={qParams.search}
            search={onSearchSuspects}
            placeholder="Search by Asset Name"
            errors=""
          />
        </div>
        <div className="flex flex-col md:flex-row lg:ml-2 justify-start items-start gap-2">
          <div className="w-full">
            <AdvancedFilterButton setShowFilters={setShowFilters} />
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() => setIsScannerActive(true)}
          >
            <i className="fas fa-search mr-1"></i> Scan Asset QR
          </button>
        </div>
      </div>
      <div>
        <SlideOver show={showFilters} setShow={setShowFilters}>
          <div className="bg-white min-h-screen p-4">
            <AssetFilter
              filter={qParams}
              onChange={applyFilter}
              closeFilter={() => setShowFilters(false)}
            />
          </div>
        </SlideOver>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="flex space-x-2 mt-2 flex-wrap w-full col-span-3">
            {badge("Facility", facilityName, ["facility", "location"])}
            {badge("Asset Name", qParams.search, ["search"])}
            {badge("Location", locationName, ["location"])}
            {badge("Asset Type", asset_type, ["asset_type"])}
            {badge("Status", qParams.status, ["status"])}
          </div>
          <div className="grow mt-10">
            <div className="py-8 md:px-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 md:-mx-8 gap-2">
                {assetsExist ? (
                  assets.map((asset: AssetData) => (
                    <div
                      key={asset.id}
                      className="w-full bg-white rounded-lg cursor-pointer border-1 shadow p-5 justify-center items-center border border-transparent hover:border-primary-500"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <div className="md:flex">
                        <p className="text-xl font-medium capitalize break-words">
                          <span className="mr-2 text-primary-500">
                            {" "}
                            {
                              (
                                (asset.asset_class &&
                                  assetClassProps[asset.asset_class]) ||
                                assetClassProps.None
                              ).icon
                            }
                          </span>
                          {asset.name}
                        </p>
                      </div>
                      <p className="font-normal text-sm">
                        {asset?.location_object?.name}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {asset.is_working ? (
                          <Badge color="green" startIcon="cog" text="Working" />
                        ) : (
                          <Badge
                            color="red"
                            startIcon="cog"
                            text="Not Working"
                          />
                        )}
                        <Badge
                          color="blue"
                          startIcon="location-arrow"
                          text={asset.status}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full pb-2 cursor-pointer mb-3">
                    <p className="text-xl font-bold capitalize text-center">
                      No Assets Found
                    </p>
                  </div>
                )}
              </div>
              {totalCount > limit && (
                <div className="mt-4 flex w-full justify-center">
                  <Pagination
                    cPage={currentPage}
                    defaultPerPage={limit}
                    data={{ totalCount }}
                    onChange={handlePagination}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssetsList;
