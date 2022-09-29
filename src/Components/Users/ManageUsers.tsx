import { useCallback, useEffect, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  addUserFacility,
  deleteUserFacility,
  getUserList,
  getUserListFacility,
  deleteUser,
  getDistrict,
  partialUpdateUser,
} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate, useQueryParams } from "raviger";
import { USER_TYPES, RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import { InputSearchBox } from "../Common/SearchBox";
import { FacilityModel } from "../Facility/models";

import { IconButton, CircularProgress } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import LinkFacilityDialog from "./LinkFacilityDialog";
import UserDeleteDialog from "./UserDeleteDialog";
import * as Notification from "../../Utils/Notifications.js";
import classNames from "classnames";
import UserFilter from "./UserFilter";
import { make as SlideOver } from "../Common/SlideOver.gen";
import UserDetails from "../Common/UserDetails";
import clsx from "clsx";
import UnlinkFacilityDialog from "./UnlinkFacilityDialog";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const getScreenSize = () => {
  const { innerWidth, innerHeight } = window;
  return { innerWidth, innerHeight };
};

export default function ManageUsers() {
  const [screenSize, setScreenSize] = useState(getScreenSize());
  useEffect(() => {
    const handleWindowResize = () => {
      setScreenSize(getScreenSize());
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const [qParams, setQueryParams] = useQueryParams();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacilityLoading, setIsFacilityLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [districtName, setDistrictName] = useState<string | undefined>(
    undefined
  );
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const isSuperuser = currentUser.data.is_superuser;
  const userType = currentUser.data.user_type;
  const userIndex = USER_TYPES.indexOf(userType);
  const userTypes = isSuperuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);
  const [linkFacility, setLinkFacility] = useState<{
    show: boolean;
    username: string;
  }>({ show: false, username: "" });

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const [unlinkFacilityData, setUnlinkFacilityData] = useState<{
    show: boolean;
    userName: string;
    facility?: FacilityModel;
  }>({ show: false, userName: "", facility: undefined });

  const limit =
    screenSize.innerWidth >= 1280
      ? RESULTS_PER_PAGE_LIMIT + 1
      : RESULTS_PER_PAGE_LIMIT;

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, { replace: true });
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit,
        offset,
        username: qParams.username,
        first_name: qParams.first_name,
        last_name: qParams.last_name,
        phone_number: qParams.phone_number,
        alt_phone_number: qParams.alt_phone_number,
        user_type: qParams.user_type,
        district_id: qParams.district_id,
      };
      if (qParams.district_id) {
        const dis = await dispatch(getDistrict(qParams.district_id));
        if (!status.aborted) {
          if (dis && dis.data) {
            setDistrictName(dis.data.name);
          }
        }
      }
      const res = await dispatch(getUserList(params));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [
      dispatch,
      limit,
      offset,
      qParams.user_type,
      qParams.username,
      qParams.first_name,
      qParams.last_name,
      qParams.phone_number,
      qParams.alt_phone_number,
      qParams.district_id,
    ]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const onUserNameChange = (value: string) => {
    setQueryParams({ ...qParams, username: value });
  };

  const addUser = (
    <button
      className="px-4 py-1 w-full md:w-auto rounded-md bg-primary-500 text-white text-lg font-semibold shadow"
      onClick={() => navigate("/user/add")}
    >
      <i className="fas fa-plus mr-2"></i>
      Add New User
    </button>
  );

  const loadFacilities = async (username: string) => {
    if (isFacilityLoading) {
      return;
    }
    setIsFacilityLoading(true);
    const res = await dispatch(getUserListFacility({ username }));
    if (res && res.data) {
      const updated = users.map((user) => {
        return user.username === username
          ? {
              ...user,
              facilities: res.data,
            }
          : user;
      });
      setUsers(updated);
    }
    setIsFacilityLoading(false);
  };

  const showLinkFacilityModal = (username: string) => {
    setLinkFacility({
      show: true,
      username,
    });
  };

  const removeFilter = (paramKey: any) => {
    updateQuery({
      ...qParams,
      [paramKey]: "",
    });
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
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

  const hideUnlinkFacilityModal = () => {
    setUnlinkFacilityData({
      show: false,
      facility: undefined,
      userName: "",
    });
  };

  const hideLinkFacilityModal = () => {
    setLinkFacility({
      show: false,
      username: "",
    });
  };

  const handleCancel = () => {
    setUserData({ show: false, username: "", name: "" });
  };

  const handleSubmit = async () => {
    const username = userData.username;
    const res = await dispatch(deleteUser(username));
    if (res?.status === 204) {
      Notification.Success({
        msg: "User deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting User: " + (res?.data?.detail || ""),
      });
    }

    setUserData({ show: false, username: "", name: "" });
    fetchData({ aborted: false });
  };

  const handleUnlinkFacilitySubmit = async () => {
    setIsFacilityLoading(true);
    await dispatch(
      deleteUserFacility(
        unlinkFacilityData.userName,
        String(unlinkFacilityData?.facility?.id)
      )
    );
    setIsFacilityLoading(false);
    loadFacilities(unlinkFacilityData.userName);
    hideUnlinkFacilityModal();
  };

  const handleDelete = (user: any) => {
    setUserData({
      show: true,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
    });
  };

  const facilityClassname = classNames({
    "align-baseline font-bold text-sm": true,
    "text-blue-500 hover:text-blue-800": !isFacilityLoading,
    "text-gray-500": isFacilityLoading,
  });

  const showLinkFacility = (username: string) => {
    return (
      <a
        onClick={() => showLinkFacilityModal(username)}
        className={facilityClassname}
        href="#"
      >
        Link new facility
      </a>
    );
  };

  const updateHomeFacility = async (username: string, facility: any) => {
    setIsFacilityLoading(true);
    await dispatch(partialUpdateUser(username, { home_facility: facility.id }));
    setIsFacilityLoading(false);
    fetchData({ aborted: false });
  };

  const showFacilities = (username: string, facilities: FacilityModel[]) => {
    if (!facilities || !facilities.length) {
      return (
        <>
          <div className="font-semibold">No Facilities!</div>
          {showLinkFacility(username)}
        </>
      );
    }
    return (
      <div className="sm:col-start-2 col-span-full sm:col-span-3">
        <div className="mb-2">
          {facilities.map((facility, i) => (
            <div
              key={`facility_${i}`}
              className="border-2 font-gbold inline-block rounded-md pl-3 py-1 mr-3 mt-2"
            >
              <div className="flex items-center  space-x-1">
                <div className="font-semibold">{facility.name}</div>
                <i
                  className="fas fa-home text-gray-500 hover:bg-gray-200 hover:text-gray-600 rounded-full p-2"
                  onClick={() => updateHomeFacility(username, facility)}
                ></i>
                <IconButton
                  size="small"
                  color="secondary"
                  disabled={isFacilityLoading}
                  onClick={() =>
                    setUnlinkFacilityData({
                      show: true,
                      facility: facility,
                      userName: username,
                    })
                  }
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        {showLinkFacility(username)}
      </div>
    );
  };

  const addFacility = async (username: string, facility: any) => {
    hideLinkFacilityModal();
    setIsFacilityLoading(true);
    const res = await dispatch(addUserFacility(username, String(facility.id)));
    if (res?.status === 201) {
      Notification.Success({
        msg: "Facility linked successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while linking facility",
      });
    }
    setIsFacilityLoading(false);
    loadFacilities(username);
  };

  const showDelete = (user: any) => {
    const STATE_ADMIN_LEVEL = USER_TYPES.indexOf("StateAdmin");
    const STATE_READ_ONLY_ADMIN_LEVEL =
      USER_TYPES.indexOf("StateReadOnlyAdmin");
    const DISTRICT_ADMIN_LEVEL = USER_TYPES.indexOf("DistrictAdmin");
    const level = USER_TYPES.indexOf(user.user_type);
    const currentUserLevel = USER_TYPES.indexOf(currentUser.data.user_type);
    if (user.is_superuser) return true;

    if (currentUserLevel >= STATE_ADMIN_LEVEL)
      return user.state_object?.id === currentUser?.data?.state;
    if (
      currentUserLevel < STATE_READ_ONLY_ADMIN_LEVEL &&
      currentUserLevel >= DISTRICT_ADMIN_LEVEL &&
      currentUserLevel > level
    )
      return user?.district_object?.id === currentUser?.data?.district;
    return false;
  };

  let userList: any[] = [];

  users &&
    users.length &&
    (userList = users.map((user: any) => {
      const cur_online = moment()
        .subtract(5, "minutes")
        .isBefore(user.last_login);
      return (
        <div
          key={`usr_${user.id}`}
          className=" w-full lg:w-1/2 xl:w-1/3 mt-6 md:px-4"
        >
          <div className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                <div className="flex lg:flex-row gap-3 flex-col justify-between flex-wrap">
                  {user.username && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800 w-fit">
                      {user.username}
                    </div>
                  )}
                  <div className="flex-shrink-0 text-sm text-gray-600 min-width-50">
                    {user.last_login && cur_online ? (
                      <span>
                        {" "}
                        <i className="fa-solid fa-clock"></i> Currently Online
                      </span>
                    ) : (
                      <>
                        <span>
                          <i className="fa-solid fa-clock"></i> Last Online:{" "}
                        </span>
                        <span
                          aria-label="Online"
                          className={clsx(
                            "shrink-0 inline-block h-2 w-2 rounded-full",
                            cur_online ? "bg-primary-400" : "bg-gray-300"
                          )}
                        ></span>
                        <span className="pl-2">
                          {user.last_login
                            ? moment(user.last_login).fromNow()
                            : "Never"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="font-black text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}

                  {user.last_login && cur_online ? (
                    <i
                      className="animate-pulse text-primary-500 fas fa-circle ml-1 opacity-75"
                      aria-label="Online"
                    ></i>
                  ) : null}
                  {showDelete(user) && (
                    <button
                      type="button"
                      className="m-3 px-3 py-2 self-end w-20 border border-red-500 text-center text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:text-white hover:bg-red-500 focus:outline-none focus:border-red-300 focus:ring-blue active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex flex-row md:grid md:grid-cols-4 gap-2 justify-between">
                  {user.user_type && (
                    <div className="col-span-2">
                      <UserDetails title="Role">
                        <div className="font-semibold">{user.user_type}</div>
                      </UserDetails>
                    </div>
                  )}
                  {user.district_object && (
                    <div className="col-span-2">
                      <UserDetails title="District">
                        <div className="font-semibold">
                          {user.district_object.name}
                        </div>
                      </UserDetails>
                    </div>
                  )}
                </div>
                {user.local_body_object && (
                  <UserDetails title="Location">
                    <div className="font-semibold">
                      {user.local_body_object.name}
                    </div>
                  </UserDetails>
                )}
                <div className="grid grid-cols-4">
                  {user.created_by && (
                    <div className="col-span-2">
                      <UserDetails title="Created by">
                        <div className="font-semibold">{user.created_by}</div>
                      </UserDetails>
                    </div>
                  )}
                  {user.phone_number && (
                    <div className="mt-2 bg-gray-50 border-t px-6 py-2 col-span-2">
                      <div className="flex py-4 justify-between">
                        <div>
                          <div className="text-gray-500 leading-relaxed">
                            Phone:
                          </div>
                          <a
                            href={`tel:${user.phone_number}`}
                            className="font-semibold"
                          >
                            {user.phone_number || "-"}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {user.username && (
                    <div className="col-span-2">
                      <UserDetails title="Home Facility">
                        <span className="font-semibold block">
                          {user.home_facility_object?.name ||
                            "No Home Facility"}
                        </span>
                      </UserDetails>
                    </div>
                  )}
                  {user.username && user.facilities && (
                    <div className="col-span-4">
                      <UserDetails title="Linked Facilities">
                        {showFacilities(user.username, user.facilities)}
                      </UserDetails>
                    </div>
                  )}
                  {user.username && !user.facilities && (
                    <a
                      onClick={() => loadFacilities(user.username)}
                      className={`col-span-4 mt-2 ${facilityClassname}`}
                      href="#"
                    >
                      Click here to show linked facilities
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }));

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (
      <div>
        {userTypes.length && addUser}
        <div className="flex flex-wrap md:-mx-4">{userList}</div>
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
    );
  } else if (users && users.length === 0) {
    manageUsers = (
      <div>
        {userTypes.length && addUser}
        <div>
          <h5> No Users Found</h5>
        </div>
      </div>
    );
  }

  return (
    <div>
      {linkFacility.show && (
        <LinkFacilityDialog
          username={linkFacility.username}
          handleOk={addFacility}
          handleCancel={hideLinkFacilityModal}
        />
      )}
      <PageTitle
        title="User Management"
        hideBack={true}
        className="mx-5 px-2"
        breadcrumbs={false}
      />

      <div className="mt-5 grid grid-cols-1 md:gap-5 sm:grid-cols-3 m-4 md:px-2">
        <div className="bg-white overflow-hidden shadow col-span-1 rounded-lg">
          <div className="p-5 w-fit sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Users
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl lg:text-5xl md:text-4xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row justify-between col-span-2 lg:px-3 space-y-3 lg:space-y-0 lg:space-x-4 my-2">
          <div className="w-full">
            <InputSearchBox
              search={onUserNameChange}
              value={qParams.username}
              placeholder="Search by User Name"
              errors=""
            />
          </div>

          <div>
            <div className="flex items-start mb-2">
              <button
                className="btn btn-primary-ghost w-full"
                onClick={() => setShowFilters((show) => !show)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fill-current w-4 h-4 mr-2"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12">
                    {" "}
                  </line>
                  <line x1="8" y1="18" x2="21" y2="18">
                    {" "}
                  </line>
                  <line x1="3" y1="6" x2="3.01" y2="6">
                    {" "}
                  </line>
                  <line x1="3" y1="12" x2="3.01" y2="12">
                    {" "}
                  </line>
                  <line x1="3" y1="18" x2="3.01" y2="18">
                    {" "}
                  </line>
                </svg>
                <span>Advanced Filters</span>
              </button>
            </div>
          </div>

          <SlideOver show={showFilters} setShow={setShowFilters}>
            <div className="bg-white min-h-screen p-4">
              <UserFilter
                filter={qParams}
                onChange={applyFilter}
                closeFilter={() => setShowFilters(false)}
              />
            </div>
          </SlideOver>
        </div>
      </div>

      <div className="flex my-2 mx-6 flex-wrap gap-2 items-center">
        {badge("Username", qParams.username, "username")}
        {badge("First Name", qParams.first_name, "first_name")}
        {badge("Last Name", qParams.last_name, "last_name")}
        {qParams.phone_number?.trim()
          ? badge("Phone Number", qParams.phone_number, "phone_number")
          : null}
        {qParams.alt_phone_number?.trim()
          ? badge(
              "WhatsApp Phone Number",
              qParams.alt_phone_number,
              "alt_phone_number"
            )
          : null}
        {qParams.user_type
          ? badge("Role", qParams.user_type, "user_type")
          : null}
        {qParams.district_id
          ? badge("District", districtName, "district_id")
          : null}
      </div>

      <div className="px-3 md:px-6">
        <div>{manageUsers}</div>
      </div>
      {userData.show && (
        <UserDeleteDialog
          name={userData.name}
          handleCancel={handleCancel}
          handleOk={handleSubmit}
        />
      )}
      {unlinkFacilityData.show && (
        <UnlinkFacilityDialog
          facilityName={unlinkFacilityData.facility?.name || ""}
          userName={unlinkFacilityData.userName}
          handleCancel={hideUnlinkFacilityModal}
          handleOk={handleUnlinkFacilitySubmit}
        />
      )}
    </div>
  );
}
